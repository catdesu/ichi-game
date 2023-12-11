import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRoom } from './entities/game-room.entity';
import { GameRoomStatus } from './enums/game-room-status.enum';
import { ROOM_MAX_PLAYERS } from 'src/constants';
import { PlayersService } from 'src/players/players.service';
import { UpdatePlayerDto } from 'src/players/dto/update-player.dto';
import { Player } from 'src/players/entities/player.entity';
import { GameState } from 'src/game-states/entities/game-state.entity';
import { playerCardsCountInterface } from './interfaces/player-cards-count.interface';
import { playerTurnOrderInterface } from './interfaces/player-turn-order.interface';
import { UpdateGameRoomDto } from './dto/update-game-room.dto';

@Injectable()
export class GameRoomService {
  private gameRooms = new Map<string, number[]>();
  public default = { draw: 0, changeColor: false, skipTurn: false, changeOrder: false };
  public drawFour = { draw: 4, changeColor: true, skipTurn: true, changeOrder: false };
  public drawTwo = { draw: 2, changeColor: false, skipTurn: true, changeOrder: false };
  public changeColor = { draw: 0, changeColor: true, skipTurn: false, changeOrder: false };
  public skipTurn = { draw: 0, changeColor: false, skipTurn: true, changeOrder: false };
  public reverseTurnOrder = { draw: 0, changeColor: false, skipTurn: false, changeOrder: true };

  constructor(
    @InjectRepository(GameRoom)
    private readonly gameRoomRepository: Repository<GameRoom>,
    private readonly playersService: PlayersService,
  ) {}

  async GetSessionPlayer(data: any): Promise<Player> {
    const player = await this.playersService.findOneById(data.userId);

    if (!player) {
    }

    return player;
  }

  async create(
    playerId: number,
  ): Promise<{ gameRoom: GameRoom; player: Player }> {
    const code = await this.generateRandomUniqueCode();
    this.gameRooms.set(code, [playerId]);

    const newGameRoom = new GameRoom();
    newGameRoom.code = code;
    newGameRoom.fk_creator_player_id = playerId;
    newGameRoom.status = GameRoomStatus.Open;
    newGameRoom.max_players = ROOM_MAX_PLAYERS;

    const createGameRoom = this.gameRoomRepository.create(newGameRoom);
    const gameRoom = await this.gameRoomRepository.save(createGameRoom);

    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = gameRoom.id;

    const player = await this.playersService.update(playerId, updatePlayerDto);

    return { gameRoom, player };
  }

  async update(id: number, updateGameRoomDto: UpdateGameRoomDto): Promise<GameRoom> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { id: id },
    });

    if (!gameRoom) throw new Error('Game room not found');

    gameRoom.code = updateGameRoomDto.code;
    gameRoom.status = updateGameRoomDto.status;

    return await this.gameRoomRepository.save(gameRoom);
  }

  async join(code: string, playerId: number): Promise<Player> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players'],
    });

    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = gameRoom.id;

    return await this.playersService.update(playerId, updatePlayerDto);
  }

  async leave(playerId: number) {
    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = null;

    await this.playersService.update(playerId, updatePlayerDto);
  }

  async getPlayers(code: string): Promise<Player[]> {
    const gameRoom: GameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players'],
    });

    return gameRoom.players;
  }

  async start(code: string): Promise<void> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
    });

    if (!gameRoom) {
    }

    gameRoom.status = GameRoomStatus.InProgress;

    await this.gameRoomRepository.save(gameRoom);
  }

  async delete(code: string): Promise<any> {
    return await this.gameRoomRepository.delete({ code: code });
  }

  private async generateRandomUniqueCode(): Promise<string> {
    const code = this.generateRandomCode();
    const gameRoomExist = await this.gameRoomRepository.find({
      where: {
        code: code,
      },
    });

    if (gameRoomExist.length > 0) {
      this.generateRandomUniqueCode();
    }

    return code;
  }

  private generateRandomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }

    return code;
  }

  getPlayableCards(playerHand: string[], playedCard: string) {
    let playableCards: string[] = [];

    if (playerHand.length > 0) {
      playerHand.forEach((card) => {
        let playableCard = this.getPlayableCard(card, playedCard);
  
        if (playableCard) {
          playableCards.push(playableCard);
        }
      });
    }

    return playableCards;
  }

  getPlayableCard(card: string, playedCard: string): string|undefined {
    let playedCardRank = this.getCardRank(playedCard);
    let playedCardColor = this.getCardColor(playedCard);

    let cardRank = this.getCardRank(card);
    let cardColor = this.getCardColor(card);

    if (cardRank === playedCardRank || cardColor === playedCardColor || ['changeColor', 'draw4'].includes(cardRank)) {
      return card;
    }

    return undefined;
  }

  getCardEffect(card: string): { draw: number, changeColor: boolean, skipTurn: boolean, changeOrder: boolean } {
    let cardRank = this.getCardRank(card);

    switch(cardRank) {
      case 'draw4':
        return this.drawFour;

      case 'draw2':
        return this.drawTwo;

      case 'changeColor':
        return this.changeColor;

      case 'skip':
        return this.skipTurn;

      case 'reverse':
        return this.reverseTurnOrder;

      default:
        return this.default;
    }
  }

  getNextPlayerIndex(currentPlayerIndex: number, gameState: GameState) {
    return gameState.is_forward_direction
      ? (currentPlayerIndex + 1) % gameState.turn_order.length
      : (currentPlayerIndex - 1 + gameState.turn_order.length) %
          gameState.turn_order.length;
  };

  getDrawedCards(drawedNumber: number, gameState: GameState) {
    let drawedCards = [];

    for (let i = 0; i < drawedNumber; i++) {
      drawedCards.push(gameState.deck.pop());
    }

    return drawedCards;
  }

  getOrderedPlayers(turnOrder: playerTurnOrderInterface[], currentPlayerUsername: string, otherPlayers: playerCardsCountInterface[]): playerCardsCountInterface[] {
    const currentPlayerIndex = turnOrder.findIndex(player => player.username === currentPlayerUsername);
    const orderedPlayers: playerCardsCountInterface[] = [];
  
    // Order other players clockwise based on the current player's position
    for (let i = currentPlayerIndex + 1; i < currentPlayerIndex + turnOrder.length; i++) {
      const index = i % turnOrder.length;
      const isCurrentPlayer = index === currentPlayerIndex;
  
      if (!isCurrentPlayer) {
        const foundPlayer = otherPlayers.find(player => player?.username === turnOrder[index]?.username);
        
        if (foundPlayer) {
          orderedPlayers.push(foundPlayer);
        }
      }
    }
  
    return orderedPlayers;
  }

  private getCardRank(card: string): string {
    return card.slice(0, -1);
  }

  private getCardColor(card: string): string {
    return card.slice(-1);
  }
}

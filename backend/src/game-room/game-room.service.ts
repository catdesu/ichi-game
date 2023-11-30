import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRoom } from './entities/game-room.entity';
import { GameRoomStatus } from './enums/game-room-status.enum';
import { ROOM_MAX_PLAYERS } from 'src/constants';
import { PlayersService } from 'src/players/players.service';
import { UpdatePlayerDto } from 'src/players/dto/update-player.dto';
import { Player } from 'src/players/entities/player.entity';

@Injectable()
export class GameRoomService {
  private gameRooms = new Map<string, number[]>();

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

  async createGameRoom(
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

  async joinGameRoom(code: string, playerId: number): Promise<Player> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players'],
    });

    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = gameRoom.id;

    return await this.playersService.update(playerId, updatePlayerDto);
  }

  async leaveGameRoom(playerId: number) {
    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = null;

    await this.playersService.update(playerId, updatePlayerDto);
  }

  async getPlayersInGameRoom(code: string): Promise<Player[]> {
    const gameRoom: GameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players'],
    });

    return gameRoom.players;
  }

  async startGameRoom(code: string): Promise<void> {
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
        return { draw: 4, changeColor: true, skipTurn: true, changeOrder: false };

      case 'draw2':
        return { draw: 2, changeColor: false, skipTurn: true, changeOrder: false };

      case 'changeColor':
        return { draw: 0, changeColor: true, skipTurn: false, changeOrder: false };

      case 'skip':
        return { draw: 0, changeColor: false, skipTurn: true, changeOrder: false };

      case 'reverse':
        return { draw: 0, changeColor: false, skipTurn: false, changeOrder: true };

      default:
        return { draw: 0, changeColor: false, skipTurn: false, changeOrder: false };
    }
  }

  private getCardRank(card: string): string {
    return card.slice(0, -1);
  }

  private getCardColor(card: string): string {
    return card.slice(-1);
  }
}

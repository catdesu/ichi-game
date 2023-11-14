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
    private readonly playersService: PlayersService
  ) {}

  async createGameRoom(playerId: number): Promise<string> {
    const code = await this.generateRandomUniqueCode();
    this.gameRooms.set(code, [playerId]);

    const newGameRoom = new GameRoom();
    newGameRoom.code = code;
    newGameRoom.status = GameRoomStatus.Open;
    newGameRoom.max_players = ROOM_MAX_PLAYERS;

    const createGameRoom = this.gameRoomRepository.create(newGameRoom);
    const gameRoom = await this.gameRoomRepository.save(createGameRoom);

    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = gameRoom.id;

    this.playersService.update(playerId, updatePlayerDto);

    return code;
  }

  async joinGameRoom(code: string, playerId: number): Promise<void> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players']
    });

    if (!gameRoom) throw new Error('Game room does not exist');

    if (gameRoom.players.length === ROOM_MAX_PLAYERS) throw new Error('Game room is already full');

    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = gameRoom.id;

    this.playersService.update(playerId, updatePlayerDto);
  }

  async getPlayersInGameRoom(code: string): Promise<Player[]> {
    const gameRoom: GameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players']
    });

    return gameRoom.players;
  }

  private async generateRandomUniqueCode(): Promise<string> {
    const code = this.generateRandomCode();
    const gameRoomExist = await this.gameRoomRepository.find({
      where: {
        code: code,
      },
    });

    console.log('game-room:', gameRoomExist);

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
}

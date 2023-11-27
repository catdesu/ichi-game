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

  async GetSessionPlayer(data: any): Promise<Player> {
    const player = await this.playersService.findOneById(data.userId);

    if (!player) {}

    return player;
  }

  async createGameRoom(playerId: number): Promise<{gameRoom: GameRoom, player: Player}> {
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

    return {gameRoom, player};
  }

  async joinGameRoom(code: string, playerId: number): Promise<Player> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players']
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
      relations: ['players']
    });

    return gameRoom.players;
  }

  async startGameRoom(code: string): Promise<void> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code }
    });

    if (!gameRoom) {}

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
}

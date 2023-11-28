import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameState } from './entities/game-state.entity';
import { Repository } from 'typeorm';
import { CreateGameStateDto } from './dto/create-game-state.dto';
import { UpdateGameStateDto } from './dto/update-game-state.dto';

@Injectable()
export class GameStatesService {
  constructor(
    @InjectRepository(GameState)
    private readonly gameStateRepository: Repository<GameState>,
  ) {}

  async findOne(gameRoomId: number): Promise<GameState> {
    const gameState = await this.gameStateRepository.findOne({
      where: { fk_game_room_id: gameRoomId }
    });

    if (!gameState) {}

    return gameState;
  }

  async create(createGameStateDto: CreateGameStateDto): Promise<GameState> {
    const gameState = new GameState();

    gameState.fk_game_room_id = createGameStateDto.fk_game_room_id;
    gameState.fk_current_player_id = createGameStateDto.fk_current_player_id;
    gameState.deck = createGameStateDto.deck;
    gameState.discard_pile = createGameStateDto.discard_pile;
    gameState.turn_order = createGameStateDto.turn_order;

    try {
      return await this.gameStateRepository.save(gameState);
    } catch (error) {
      throw new BadRequestException('Failed to create game state.');
    }
  }

  async update(updateGameStateDto: UpdateGameStateDto) {
    
  }
}

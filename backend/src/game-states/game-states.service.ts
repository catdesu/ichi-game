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

  async findOneByGameRoomId(gameRoomId: number): Promise<GameState> {
    const gameState = await this.gameStateRepository.findOne({
      where: { fk_game_room_id: gameRoomId }
    });

    if (!gameState) {}

    return gameState;
  }

  async create(createGameStateDto: CreateGameStateDto): Promise<GameState> {
    const gameState = new GameState();

    gameState.fk_game_room_id = createGameStateDto.fk_game_room_id;
    gameState.deck = createGameStateDto.deck;
    gameState.discard_pile = createGameStateDto.discard_pile;
    gameState.turn_order = createGameStateDto.turn_order;
    gameState.is_forward_direction = createGameStateDto.is_forward_direction;

    try {
      return await this.gameStateRepository.save(gameState);
    } catch (error) {
      throw new BadRequestException('Failed to create game state.');
    }
  }

  async update(id: number, updateGameStateDto: UpdateGameStateDto): Promise<GameState> {
    const gameState = await this.gameStateRepository.findOne({
      where: { id: id }
    });

    if (!gameState) {}

    gameState.deck = updateGameStateDto.deck;
    gameState.discard_pile = updateGameStateDto.discard_pile;
    gameState.turn_order = updateGameStateDto.turn_order;
    gameState.is_forward_direction = updateGameStateDto.is_forward_direction;

    try {
      return await this.gameStateRepository.save(gameState);
    } catch (error) {
      throw new BadRequestException('Failed to create game state.');
    }
  }
}

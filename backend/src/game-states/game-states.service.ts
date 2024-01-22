import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  /**
   * Finds a game state based on the provided game room ID.
   * 
   * @param {number} gameRoomId - The ID of the game room.
   * @returns {Promise<GameState>} A promise that resolves to the found game state.
   * @throws Throws an exception if the game state is not found.
   */
  async findOneByGameRoomId(gameRoomId: number): Promise<GameState> {
    const gameState = await this.gameStateRepository.findOne({
      where: { fk_game_room_id: gameRoomId }
    });

    if (!gameState) throw new NotFoundException('Game state not found.');

    return gameState;
  }

  /**
   * Creates a new game state with the provided data.
   * 
   * @param {CreateGameStateDto} createGameStateDto - The data to create the game state.
   * @returns {Promise<GameState>} A promise that resolves to the created game state.
   * @throws Throws an exception if the creation fails.
   */
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

  /**
   * Updates a game state with the provided ID and data.
   * 
   * @param {number} id - The ID of the game state to be updated.
   * @param {UpdateGameStateDto} updateGameStateDto - The data to update the game state.
   * @returns {Promise<GameState>} A promise that resolves to the updated game state.
   * @throws Throws an exception if the update fails.
   */
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
      throw new BadRequestException('Failed to update game state.');
    }
  }

  /**
   * Deletes a game state by its ID.
   * 
   * @param {number} id - The ID of the game state to be deleted.
   * @returns {Promise<any>} A promise indicating the result of the deletion operation.
   */
  async delete(id: number): Promise<any> {
    return await this.gameStateRepository.delete({ id: id });
  }

  /**
   * Switches the player turn in the game state.
   * 
   * @param {number} currentPlayerIndex - The index of the current player in the turn order.
   * @param {number} nextPlayerIndex - The index of the next player in the turn order.
   * @param {GameState} gameState - The current game state.
   * @param {boolean} [askChallenge] - Optional flag indicating whether an open challenge dialog is initiated.
   * @returns {GameState} The updated game state after switching the player turn.
   */
  switchPlayerTurn(currentPlayerIndex: number, nextPlayerIndex: number, gameState: GameState, askChallenge?: boolean): GameState {
    gameState.turn_order[currentPlayerIndex].isPlayerTurn = false;
    gameState.turn_order[currentPlayerIndex].hasDrawnThisTurn = false;
    gameState.turn_order[currentPlayerIndex].openChallengeDialog = false;
    gameState.turn_order[nextPlayerIndex].isPlayerTurn = askChallenge ? false : true;
    gameState.turn_order[nextPlayerIndex].hasDrawnThisTurn = false;
    gameState.turn_order[nextPlayerIndex].openChallengeDialog = askChallenge ? true : false;

    return gameState;
  }

  /**
   * Remakes the deck from the discard pile, ensuring the new deck contains the specified top card.
   * 
   * @param {GameState} gameState - The current game state.
   * @param {string} topCard - The top card to be included in the new deck.
   * @returns {Promise<GameState>} A promise that resolves with the updated game state.
   */
  async remakeDeckFromDiscardPile(gameState: GameState, topCard: string): Promise<GameState> {
    const newDeck = [...gameState.discard_pile];
    const newDiscardPile = [topCard];

    newDeck.forEach((card, index) => {
      if (['changeColor', 'draw4'].includes(card.slice(0, -1))) {
        newDeck[index] = card.slice(0, -1) + 'W';
      }
    });

    newDeck.shift();
    newDeck.sort(() => Math.random() - 0.5);

    const updateGameStateDto: UpdateGameStateDto = {
      deck: newDeck,
      discard_pile: newDiscardPile,
      turn_order: gameState.turn_order,
    };

    return await this.update(
      gameState.id,
      updateGameStateDto,
    );
  }
}

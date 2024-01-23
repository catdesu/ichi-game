import { Injectable, NotFoundException } from '@nestjs/common';
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

  /**
   * Finds and returns a game room based on the specified code.
   * 
   * @param {string} code - The code of the game room to find.
   * @returns {Promise<GameRoom>} A promise that resolves with the found game room.
   * @throws Throws an exception if the game room is not found.
   */
  async findOneByCode(code: string): Promise<GameRoom> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players'],
    });

    if (!gameRoom) throw new NotFoundException('Game room not found.');

    return gameRoom;
  }

  /**
   * Creates a new game room and associates the specified player as the creator.
   * 
   * @param {number} playerId - The ID of the player creating the game room.
   * @returns {Promise<{ gameRoom: GameRoom; player: Player }>} A promise that resolves with the created game room and associated player.
   */
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

  /**
   * Updates the specified game room with the given ID using the provided data.
   * 
   * @param {number} id - The ID of the game room to update.
   * @param {UpdateGameRoomDto} updateGameRoomDto - The data to update the game room with.
   * @returns {Promise<GameRoom>} A promise that resolves with the updated game room information.
   * @throws Throws an exception if the game room with the specified ID is not found.
   */
  async update(id: number, updateGameRoomDto: UpdateGameRoomDto): Promise<GameRoom> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { id: id },
    });

    if (!gameRoom) throw new NotFoundException('Game room not found.');

    gameRoom.code = updateGameRoomDto.code;
    gameRoom.status = updateGameRoomDto.status;

    return await this.gameRoomRepository.save(gameRoom);
  }

  /**
   * Joins the specified game room with the given code for the player with the specified ID.
   * 
   * @param {string} code - The code of the game room to join.
   * @param {number} playerId - The ID of the player joining the game room.
   * @returns {Promise<Player>} A promise that resolves with the player's information after joining the game room.
   */
  async join(code: string, playerId: number): Promise<Player> {
    const gameRoom = await this.gameRoomRepository.findOne({
      where: { code: code },
      relations: ['players'],
    });

    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = gameRoom.id;

    return await this.playersService.update(playerId, updatePlayerDto);
  }

  /**
   * Leaves the game room for the player with the specified ID.
   * 
   * @param {number} playerId - The ID of the player leaving the game room.
   * @returns {Promise<any>} A promise that resolves when the player has successfully left the game room.
   */
  async leave(playerId: number): Promise<any> {
    const updatePlayerDto: UpdatePlayerDto = new UpdatePlayerDto();
    updatePlayerDto.fk_game_room_id = null;

    return await this.playersService.update(playerId, updatePlayerDto);
  }

  /**
   * Retrieves the players associated with the specified game room code.
   * 
   * @param {string} code - The code of the game room.
   * @returns {Promise<Player[]>} A promise that resolves to an array of players in the game room.
   */
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

  /**
   * Deletes the game room with the specified code.
   * 
   * @param {string} code - The code of the game room to be deleted.
   * @returns {Promise<any>} A promise that resolves when the deletion is complete.
   */
  async delete(code: string): Promise<any> {
    return await this.gameRoomRepository.delete({ code: code });
  }

  /**
   * Generates a random alphanumeric code of length 6, ensuring its uniqueness.
   * 
   * @returns {Promise<string>} The generated random and unique code.
   */
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

  /**
   * Generates a random alphanumeric code of length 6.
   * 
   * @returns {string} The generated random code.
   */
  private generateRandomCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }

    return code;
  }

  /**
   * Finds all playable cards in a player's hand based on the previously played card.
   * 
   * @param {string[]} playerHand - The hand of the player containing cards to check for playability.
   * @param {string} playedCard - The previously played card.
   * @returns {string[]} Array of playable cards.
   */
  getPlayableCards(playerHand: string[], playedCard: string): string[] {
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

  /**
   * Determines if a card is playable based on the previously played card.
   * 
   * @param {string} card - The card to check for playability.
   * @param {string} playedCard - The previously played card.
   * @returns {string|undefined} The card if it is playable; otherwise, undefined.
   */
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

  /**
   * Gets the effect of a card, including the number of cards to draw and special actions.
   * 
   * @param {string} card - The card to determine the effect for.
   * @returns {Object} An object containing the card's effect properties: { draw: number, changeColor: boolean, skipTurn: boolean, changeOrder: boolean }.
   */
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

  /**
   * Gets the index of the next player in the turn order based on the current player's index and game state.
   * 
   * @param {number} currentPlayerIndex - The index of the current player in the turn order.
   * @param {GameState} gameState - The current game state.
   * @returns {number} The index of the next player.
   */
  getNextPlayerIndex(currentPlayerIndex: number, gameState: GameState): number {
    return gameState.is_forward_direction
      ? (currentPlayerIndex + 1) % gameState.turn_order.length
      : (currentPlayerIndex - 1 + gameState.turn_order.length) %
          gameState.turn_order.length;
  };

  /**
   * Gets the specified number of drawn cards from the game state's deck.
   * 
   * @param {number} drawedNumber - The number of cards to draw.
   * @param {GameState} gameState - The current game state.
   * @returns {string[]} The drawn cards.
   */
  getDrawedCards(drawedNumber: number, gameState: GameState): string[] {
    let drawedCards = [];

    for (let i = 0; i < drawedNumber; i++) {
      drawedCards.push(gameState.deck.pop());
    }

    return drawedCards;
  }

  /**
   * Gets the ordered players clockwise based on the current player's position.
   * 
   * @param {playerTurnOrderInterface[]} turnOrder - The turn order of players in the game.
   * @param {string} currentPlayerUsername - The username of the current player.
   * @param {playerCardsCountInterface[]} otherPlayers - Other players in the game.
   * @returns {playerCardsCountInterface[]} The ordered players clockwise.
   */
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

  /**
   * Gets the rank of a card.
   * 
   * @param {string} card - The card for which to get the rank.
   * @returns {string} The rank of the card.
   */
  private getCardRank(card: string): string {
    return card.slice(0, -1);
  }

  /**
   * Gets the color of a card.
   * 
   * @param {string} card - The card for which to get the color.
   * @returns {string} The color of the card.
   */
  private getCardColor(card: string): string {
    return card.slice(-1);
  }
}

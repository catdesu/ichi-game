import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { Repository } from 'typeorm';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import * as argon2 from 'argon2';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  /**
   * Finds a player by their ID.
   * 
   * @param {number} id - The ID of the player to search for.
   * @returns {Promise<Player>} A promise resolving to the player with the specified ID.
   * @throws If no player is found with the given ID.
   */
  findOneById(id: number): Promise<Player> {
    const player = this.playerRepository.findOne({ where: { id: id }, relations: ['gameRoom', 'gameRoom.players'] });

    if (!player) throw new NotFoundException(`Player not found`);

    return player;
  }

  /**
   * Finds a player by their username.
   * 
   * @param {string} username - The username to search for.
   * @returns {Promise<Player>} A promise resolving to the player with the specified username.
   * @throws If no player is found with the given username.
   */
  async findOneByUsername(username: string): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { username: username },
    });

    if (!player) throw new NotFoundException(`Player not found`);

    return player;
  }

  /**
   * Creates a new player based on the provided data.
   * 
   * @param {CreatePlayerDto} createPlayerDto - The data for creating the new player.
   * @returns {Promise<Player>} A promise resolving to the newly created player.
   * @throws If the username is already taken or registration fails.
   */
  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const playerExists = await this.playerRepository.findOne({
      where: { username: createPlayerDto.username }
    });

    if (!playerExists) {
      const player = new Player();
  
      player.username = createPlayerDto.username;
      player.password = await this.hashPassword(createPlayerDto.password);
  
      try {
        return await this.playerRepository.save(player);
      } catch (error) {
        throw new BadRequestException('Registration failed.');
      }
    } else {
      throw new BadRequestException('Username already taken.');
    }
  }

  /**
   * Updates a player's information by their ID.
   * 
   * @param {number} id - The ID of the player to be updated.
   * @param {UpdatePlayerDto} updatePlayerDto - The data to be updated for the player.
   * @returns {Promise<Player>} A promise representing the completion of the update.
   * @throws If the player with the given ID is not found.
   */
  async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id: id },
    });

    if (!player) throw new NotFoundException('Player not found');

    player.fk_game_room_id = updatePlayerDto.fk_game_room_id;
    player.hand_cards = updatePlayerDto.hand_cards;

    return await this.playerRepository.save(player);
  }
  
  /**
   * Updates a player's information by their username.
   * 
   * @param {string} username - The username of the player to be updated.
   * @param {UpdatePlayerDto} updatePlayerDto - The data to be updated for the player.
   * @returns {Promise<Player>} A promise representing the completion of the update.
   * @throws If the player with the given username is not found.
   */
  async updateByUsername(username: string, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { username: username },
    });

    if (!player) throw new NotFoundException('Player not found');

    player.hand_cards = updatePlayerDto.hand_cards;

    return await this.playerRepository.save(player);
  }

  /**
   * Hashes the provided password using Argon2 hashing.
   * 
   * @param {string} password - The password to be hashed.
   * @returns {Promise<string>} A promise that resolves to the hashed password.
   */
  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

  /**
   * Compares the stored password hash with the entered password using Argon2 hashing.
   * 
   * @param {string} storedPasswordHash - The stored password hash to compare.
   * @param {string} enteredPassword - The entered password for comparison.
   * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, otherwise false.
   * @throws Throws an exception if the comparison fails, indicating invalid credentials.
   */
  async comparePassword(
    storedPasswordHash: string,
    enteredPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(storedPasswordHash, enteredPassword);
    } catch (err) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}

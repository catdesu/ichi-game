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

  findOneById(id: number) {
    const player = this.playerRepository.findOne({ where: { id: id }, relations: ['gameRoom', 'gameRoom.players'] });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  findOneByUsername(username: string) {
    const player = this.playerRepository.findOne({
      where: { username: username },
    });

    if (!player) {
      throw new NotFoundException(`Player with username ${username} not found`);
    }

    return player;
  }

  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const player = new Player();

    player.username = createPlayerDto.username;
    player.password = await this.hashPassword(createPlayerDto.password);

    try {
      return await this.playerRepository.save(player);
    } catch (error) {
      throw new BadRequestException('Failed to create user.');
    }
  }

  async update(id: number, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.playerRepository.findOne({
      where: { id: id },
    });

    if (!player) throw new Error('Player not found');

    player.fk_game_room_id = updatePlayerDto.fk_game_room_id;
    player.hand_cards = updatePlayerDto.hand_cards;

    return await this.playerRepository.save(player);
  }
  
  async updateByUsername(username: string, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.playerRepository.findOne({
      where: { username: username },
    });

    if (!player) throw new Error('Player not found');

    player.hand_cards = updatePlayerDto.hand_cards;

    return await this.playerRepository.save(player);
  }

  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }

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

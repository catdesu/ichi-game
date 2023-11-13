import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRoom } from './entities/game-room.entity';

@Injectable()
export class GameRoomService {
  private gameRooms = new Map<string, number[]>();

  constructor(@InjectRepository(GameRoom) private readonly gameRoomRepository: Repository<GameRoom>) {}

  async createGameRoom(playerId: number): Promise<void> {
    const code = await this.generateRandomUniqueCode();
    console.log(code);
    this.gameRooms.set(code, [playerId]);
    console.log(this.gameRooms);
  }

  joinGameRoom(code: string, playerId: number): void {
    const players = this.gameRooms.get(code) || [];
    players.push(playerId);
    this.gameRooms.set(code, players);
    console.log(this.gameRooms);
  }

  getPlayersInGameRoom(code: string): number[] {
    return this.gameRooms.get(code) || [];
  }

  private async generateRandomUniqueCode(): Promise<string> {
    const code = this.generateRandomCode();
    const gameRoomExist = await this.gameRoomRepository.find({
      where: {
        code: code
      }
    });

    console.log("game-room:", gameRoomExist)

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

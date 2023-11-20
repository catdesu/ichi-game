import { Injectable, UseGuards } from '@nestjs/common';
import { Player } from 'src/players/entities/player.entity';
import { PlayersService } from 'src/players/players.service';
import { JwtService } from '@nestjs/jwt';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Injectable()
export class AuthService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const player = await this.playersService.findOneByUsername(username);

    if (
      player &&
      (await this.playersService.comparePassword(player.password, password))
    ) {
      const { password, ...result } = player;
      return result;
    }

    return null;
  }

  @UseGuards(LocalAuthGuard)
  async login(player: Player) {
    const payload = { username: player.username, userId: player.id };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '4h' }),
    };
  }
}

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

  /**
   * Validates a user's credentials by checking the provided username and password.
   * 
   * @param {string} username - The username of the player.
   * @param {string} password - The password entered by the user.
   * @returns {Promise<Player | null>} The player object if validation is successful, otherwise returns null.
   */
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

  /**
   * Logs in a player and generates an access token for authentication.
   * 
   * @param {Player} player - The player object to generate the access token for.
   * @returns {Object} An object containing the generated access token.
   */
  @UseGuards(LocalAuthGuard)
  async login(player: Player) {
    const payload = { username: player.username, userId: player.id };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '4h' }),
    };
  }
}

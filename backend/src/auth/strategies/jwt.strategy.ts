import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PlayersService } from 'src/players/players.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly playersService: PlayersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${`${process.env.SECRET_KEY}`}`,
    });
  }

  async validate(payload: any) {
    const player = await this.playersService.findOneById(payload.sub);

    if (!player) {
      throw new UnauthorizedException();
    }

    return player;
  }
}

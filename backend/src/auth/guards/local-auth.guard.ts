import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(err, player, info) {
    
    if (err || !player) {
      throw err || new UnauthorizedException();
    }

    return player;
  }
}

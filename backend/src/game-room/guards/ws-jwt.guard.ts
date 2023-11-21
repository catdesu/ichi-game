import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;
    console.log('client', client);
    console.log('token', token);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: `${process.env.SECRET_KEY}`,
      });
      console.log(decoded);
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expiré');
      } else {
        throw new UnauthorizedException('Token invalide');
      }
    }
  }
}

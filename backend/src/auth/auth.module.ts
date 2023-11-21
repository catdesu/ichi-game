import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PlayersModule } from 'src/players/players.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: `${process.env.SECRET_KEY}`,
      signOptions: { expiresIn: '720m' },
    }),
    PlayersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalAuthGuard, LocalStrategy, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}

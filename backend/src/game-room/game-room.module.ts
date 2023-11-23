import { Module } from '@nestjs/common';
import { GameRoomService } from './game-room.service';
import { GameRoomGateway } from './game-room.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRoom } from './entities/game-room.entity';
import { PlayersModule } from 'src/players/players.module';
import { AuthModule } from 'src/auth/auth.module';
import { GameStatesModule } from 'src/game-states/game-states.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameRoom]),
    AuthModule,
    PlayersModule,
    GameStatesModule,
  ],
  providers: [GameRoomService, GameRoomGateway],
})
export class GameRoomModule {}

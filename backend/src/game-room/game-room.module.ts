import { Module } from '@nestjs/common';
import { GameRoomService } from './game-room.service';
import { GameRoomGateway } from './game-room.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRoom } from './entities/game-room.entity';
import { PlayersModule } from 'src/players/players.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameRoom]), AuthModule, PlayersModule],
  providers: [GameRoomService, GameRoomGateway],
})
export class GameRoomModule {}

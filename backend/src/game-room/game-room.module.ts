import { Module } from '@nestjs/common';
import { GameRoomService } from './game-room.service';
import { GameRoomGateway } from './game-room.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRoom } from './entities/game-room.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameRoom])],
  providers: [GameRoomService, GameRoomGateway]
})
export class GameRoomModule {}

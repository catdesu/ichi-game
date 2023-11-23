import { Module } from '@nestjs/common';
import { GameStatesService } from './game-states.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameState } from './entities/game-state.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameState])],
  providers: [GameStatesService],
  exports: [GameStatesService],
})
export class GameStatesModule {}

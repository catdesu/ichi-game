import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat/chat.gateway';
import { PlayersModule } from './players/players.module';
import { GameRoomGateway } from './game-room/game-room.gateway';
import { GameRoomModule } from './game-room/game-room.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/entities/*.entity{.ts}'],
      synchronize: false,
      autoLoadEntities: true
    }),
    PlayersModule,
    GameRoomModule
  ],
  controllers: [],
  providers: [ChatGateway],
})
export class AppModule {}

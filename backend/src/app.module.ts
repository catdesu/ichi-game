import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersModule } from './players/players.module';
import { GameRoomModule } from './game-room/game-room.module';
import { AuthModule } from './auth/auth.module';
import { GameStatesModule } from './game-states/game-states.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/entities/*.entity{.ts}'],
      synchronize: false,
      autoLoadEntities: true,
    }),
    PlayersModule,
    GameRoomModule,
    AuthModule,
    GameStatesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

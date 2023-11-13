import { IsAlphanumeric, IsEnum, IsNotEmpty, IsNumber, Length } from "class-validator";
import { GameRoomStatus } from "../enums/game-room-status.enum";

export class CreatePlayerDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;

  @IsNotEmpty()
  @IsEnum(GameRoomStatus)
  status: GameRoomStatus;

  @IsNotEmpty()
  @IsNumber()
  max_players: number;
}
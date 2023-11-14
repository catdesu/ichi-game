import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdatePlayerDto {
  @IsNumber()
  @IsNotEmpty()
  fk_game_room_id: number;
}
import { IsNumber, IsString } from "class-validator";

export class CreateGameStateDto {
  @IsNumber()
  fk_game_room_id: number;

  @IsNumber()
  fk_current_player_id: number;

  @IsString()
  deck: string;

  @IsString()
  discard_pile: string;

  @IsString()
  turn_order: string;
}
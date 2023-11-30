import { IsBoolean, IsNumber, IsString } from "class-validator";

export class CreateGameStateDto {
  @IsNumber()
  fk_game_room_id: number;

  @IsString()
  deck: string[];

  @IsString()
  discard_pile: string[];

  @IsString()
  turn_order: { username: string, isPlayerTurn: boolean }[];
  
  @IsBoolean()
  is_forward_direction: boolean;
}
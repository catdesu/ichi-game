import { IsBoolean, IsNumber, IsString } from "class-validator";
import { playerTurnOrderInterface } from "src/game-room/interfaces/player-turn-order.interface";

export class CreateGameStateDto {
  @IsNumber()
  fk_game_room_id: number;

  @IsString()
  deck: string[];

  @IsString()
  discard_pile: string[];

  @IsString()
  turn_order: playerTurnOrderInterface[];
  
  @IsBoolean()
  is_forward_direction: boolean;
}
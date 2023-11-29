import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePlayerDto {
  @IsNumber()
  @IsOptional()
  fk_game_room_id?: number;
  
  @IsString()
  @IsOptional()
  hand_cards?: string[];
}

import { IsNumber, IsOptional } from 'class-validator';

export class UpdatePlayerDto {
  @IsNumber()
  @IsOptional()
  fk_game_room_id: number | null;
}

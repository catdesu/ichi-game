import { IsAlphanumeric, IsNotEmpty, IsNumber, IsOptional, IsString, Length, MinLength } from "class-validator";

export class CreatePlayerDto {
  @IsNumber()
  @IsOptional()
  fk_game_room_id?: number;
  
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  @Length(3, 30)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
  
  @IsString()
  @IsOptional()
  hand_cards?: string[];
}
import { IsAlphanumeric, IsNotEmpty, IsString, Length, MinLength } from "class-validator";

export class CreatePlayerDto {
  @IsString()
  @IsAlphanumeric()
  @IsNotEmpty()
  @Length(3, 30)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
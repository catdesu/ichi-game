import { IsAlphanumeric, IsNotEmpty, Length } from "class-validator";

export class CreatePlayerDto {
  @IsAlphanumeric()
  @IsNotEmpty()
  @Length(3, 30)
  username: string;
}
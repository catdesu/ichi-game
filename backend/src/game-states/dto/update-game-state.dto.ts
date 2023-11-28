import { CreateGameStateDto } from "./create-game-state.dto";
import { PartialType } from '@nestjs/mapped-types';

export class UpdateGameStateDto extends PartialType(CreateGameStateDto) {}
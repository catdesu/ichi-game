import { PartialType } from "@nestjs/mapped-types";
import { CreateGameRoomDto } from "./create-game-room.dto";

export class UpdateGameRoomDto extends PartialType(CreateGameRoomDto) {}
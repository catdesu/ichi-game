import { GameRoomStatus } from "../enums/game-room-status.enum";
import { playersInterface } from "./players.interface";

export interface SessionsInterface {
  status: GameRoomStatus;
  players: playersInterface[];
  deck?: string[];
  discardPile?: string[];
  voteResult?: any;
}
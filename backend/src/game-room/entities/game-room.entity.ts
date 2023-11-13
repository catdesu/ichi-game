import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { GameRoomStatus } from "../enums/game-room-status.enum";

@Entity()
export class GameRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 6 })
  code: string;

  @Column({
    type: 'enum',
    enum: GameRoomStatus,
    default: GameRoomStatus.Open,
  })
  status: GameRoomStatus;

  @Column()
  max_players: number;
}
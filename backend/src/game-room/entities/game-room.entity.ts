import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { GameRoomStatus } from "../enums/game-room-status.enum";
import { Player } from "src/players/entities/player.entity";

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

  @OneToMany(() => Player, (player) => player.gameRoom)
  players: Player[];
}
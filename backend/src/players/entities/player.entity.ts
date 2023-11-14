import { GameRoom } from "src/game-room/entities/game-room.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  fk_game_room_id: number;

  @ManyToOne(() => GameRoom, (gameRoom) => gameRoom.players)
  @JoinColumn({ name: 'fk_game_room_id' })
  gameRoom: GameRoom;

  @Column({ length: 30 })
  username: string;

  @Column({ nullable: true, type: 'json' })
  hand_cards: Record<string, any>;
}
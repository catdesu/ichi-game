import { Exclude } from "class-transformer";
import { GameRoom } from "src/game-room/entities/game-room.entity";
import { GameState } from "src/game-states/entities/game-state.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

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

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ nullable: true, type: 'json' })
  hand_cards: string[];

  @OneToOne(() => GameState)
  gameState: GameState;
}
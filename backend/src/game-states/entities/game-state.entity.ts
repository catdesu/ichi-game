import { GameRoom } from "src/game-room/entities/game-room.entity";
import { Player } from "src/players/entities/player.entity";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class GameState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fk_game_room_id: number;

  @Column({ type: 'json' })
  deck: string[];
  
  @Column({ type: 'json' })
  discard_pile: string[];
  
  @Column({ type: 'json' })
  turn_order: { username: string, isPlayerTurn: boolean }[];
  
  @Column()
  is_forward_direction: boolean;

  @OneToOne(() => GameRoom)
  gameRoom: GameRoom;
  
  @OneToOne(() => Player)
  currentPlayer: Player;
}
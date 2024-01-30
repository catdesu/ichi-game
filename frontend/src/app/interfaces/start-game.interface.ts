import { PlayerCardsInterface } from "./player-cards.interface";
import { TurnOrderInterface } from "./turn-order.interface";

export interface StartGameInterface {
  started: boolean;
  hand_cards: string[];
  played_card: string;
  player_cards: PlayerCardsInterface[];
  playable_cards: string[];
  turnOrder: TurnOrderInterface[];
  direction: boolean;
}

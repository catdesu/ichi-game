export interface GameInterface {
  started: boolean;
  hand_cards: string[];
  played_card: string;
  player_cards: { username: string; cardsCount: number }[];
  playable_cards: string[];
}

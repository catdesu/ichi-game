import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'playerTurnStyle'
})
export class PlayerTurnStylePipe implements PipeTransform {

  transform(username: unknown, turnOrder: { username: string, isPlayerTurn: boolean, hasDrawnThisTurn: boolean }[]): object {
    let filter = { 'filter': 'none' };

    if (turnOrder.length > 0) {
      turnOrder.forEach((turn) => {
        if (turn.username === username && !turn.isPlayerTurn) {
          filter = { 'filter': 'brightness(50%)' };
        }
      });
    }
    
    return filter;
  }
}

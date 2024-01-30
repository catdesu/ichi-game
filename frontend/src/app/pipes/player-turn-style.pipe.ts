import { Pipe, PipeTransform } from '@angular/core';
import { TurnOrderInterface } from '../interfaces/turn-order.interface';

@Pipe({
  name: 'playerTurnStyle'
})
export class PlayerTurnStylePipe implements PipeTransform {

  transform(username: unknown, turnOrder: TurnOrderInterface[]): object {
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

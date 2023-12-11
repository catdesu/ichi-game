import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cardStyle'
})
export class CardStylePipe implements PipeTransform {

  transform(cardName: string, playableCards: string[]): object {
    const isPlayable = playableCards.includes(cardName);

    return {
      'filter': isPlayable ? 'none' : 'brightness(50%)'
    };
  }

}

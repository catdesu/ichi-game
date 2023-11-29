import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cardStyle'
})
export class CardStylePipe implements PipeTransform {

  transform(cardName: string, playableCards: string[], isTopCard: boolean): object {
    const isPlayable = playableCards.includes(cardName);

    return {
      'background': `url("../../../assets/images/cards-front/${cardName}.png") center/cover`,
      'color': 'transparent',
      'filter': isPlayable ? 'none' : ( isTopCard ? 'none' : 'brightness(50%)')
    };
  }

}

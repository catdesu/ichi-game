import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getCardSpacing'
})
export class GetCardSpacingPipe implements PipeTransform {

  transform(index: number): unknown {
    return `calc(2.2em * ${index})`;
  }

}

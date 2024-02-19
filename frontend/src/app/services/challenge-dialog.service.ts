import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { ChallengeDialogComponent } from '../components/challenge-dialog/challenge-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ChallengeDialogService {
  constructor(private dialogService: DialogService) {}

  private numberObject: any = {
    'zero': 0,
    'one': 1,
    'two': 2,
    'three': 3,
    'four': 4,
    'five': 5,
    'six': 6,
    'seven': 7,
    'eight': 8,
    'nine': 9,
  }
  
  private colorObject: any = {
    R: 'red',
    B: 'blue',
    G: 'green',
    Y: 'yellow',
  }

  openChallengeDialog(username: string, card: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const ref = this.dialogService.open(ChallengeDialogComponent, {
        width: '400px',
        closable: false,
        data: { username: username, cardNumber: this.getCardRank(card), cardColor: this.getCardColor(card) },
      });

      ref.onClose.subscribe((isChallenging: boolean) => {
        resolve(isChallenging);
      });
    });
  }

  private getCardRank(card: string): string {
    const cardRank: string = card.slice(0, -1);

    if (['changeColor', 'draw4'].includes(cardRank)) {
      return '';
    } else {
      return this.numberObject[cardRank];
    }
  }

  private getCardColor(card: string): string {
    const cardColorChar = card.slice(-1);
    return this.colorObject[cardColorChar];
  }
}

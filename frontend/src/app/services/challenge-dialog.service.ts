import { Injectable } from '@angular/core';
import { DialogService } from 'primeng/dynamicdialog';
import { ChallengeDialogComponent } from '../components/challenge-dialog/challenge-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ChallengeDialogService {
  constructor(private dialogService: DialogService) {}

  openChalengeDialog(username: string, card: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const ref = this.dialogService.open(ChallengeDialogComponent, {
        width: '400px',
        closable: false,
        data: { username: username, card: card },
      });

      ref.onClose.subscribe((isChallenging: boolean) => {
        resolve(isChallenging);
      });
    });
  }

  private getCardRank(card: string): string {
    return card.slice(0, -1);
  }

  private getCardColor(card: string): string {
    return card.slice(-1);
  }
}

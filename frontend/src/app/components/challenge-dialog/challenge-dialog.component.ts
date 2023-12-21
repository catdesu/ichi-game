import { Component, Inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-challenge-dialog',
  templateUrl: './challenge-dialog.component.html',
  styleUrls: ['./challenge-dialog.component.css']
})
export class ChallengeDialogComponent implements OnInit {
  username?: string;
  cardNumber?: string;
  cardColor?: string;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
      this.username = this.config.data.username;
      this.cardNumber = this.config.data.cardNumber;
      this.cardColor = this.config.data.cardColor;
  }

  challenge(isChallenging: boolean): void {
    this.ref.close(isChallenging);
  }
}

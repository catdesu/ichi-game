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
  cardText?: string;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    this.username = this.config.data.username;
    this.cardNumber = this.config.data.cardNumber;
    this.cardColor = this.config.data.cardColor;

    if (this.cardNumber) {
      if (this.cardNumber == '8') {
        this.cardNumber = `an ${this.cardNumber}`;
      } else {
        this.cardNumber = `a ${this.cardNumber}`;
      }
    }

    if (this.cardColor) {
      this.cardColor = `a ${this.cardColor}`;
    }

    if (this.cardNumber && this.cardColor) {
      this.cardText = `${this.cardNumber} or ${this.cardColor}`;
    } else {
      this.cardText = this.cardColor;
    }
  }

  challenge(isChallenging: boolean): void {
    this.ref.close(isChallenging);
  }
}

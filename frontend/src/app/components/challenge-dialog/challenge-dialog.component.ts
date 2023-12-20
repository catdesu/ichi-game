import { Component, Inject, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-challenge-dialog',
  templateUrl: './challenge-dialog.component.html',
  styleUrls: ['./challenge-dialog.component.css']
})
export class ChallengeDialogComponent implements OnInit {
  username?: string;
  card?: string;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
      this.username = this.config.data.username;
      this.card = this.config.data.card;
  }

  challenge(isChallenging: boolean): void {
    this.ref.close(isChallenging);
  }
}

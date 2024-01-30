import { Injectable } from '@angular/core';
import { ColorDialogComponent } from '../components/color-dialog/color-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';

@Injectable({
  providedIn: 'root',
})
export class ColorDialogService {
  constructor(private dialogService: DialogService) {}

  openColorDialog(): Promise<string> {
    return new Promise<string>(resolve => {
      const ref = this.dialogService.open(ColorDialogComponent, {
        header: 'Choose a Color',
        width: '300px',
        closable: false,
      });

      ref.onClose.subscribe((color: string) => {
        resolve(color);
      });
    });
  }
}

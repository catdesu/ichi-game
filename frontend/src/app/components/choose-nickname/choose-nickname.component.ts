import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PlayersService } from 'src/app/services/players.service';

@Component({
  selector: 'app-choose-nickname',
  templateUrl: './choose-nickname.component.html',
  styleUrls: ['./choose-nickname.component.css'],
})
export class ChooseNicknameComponent {
  playerForm: FormGroup = new FormGroup({
    nickname: new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30),
      Validators.pattern('^[0-9a-zA-Z_-]+$'),
    ]),
  });

  constructor(
    private readonly playerService: PlayersService,
    private readonly toastrService: ToastrService
  ) {}

  onSubmit() {
    if (this.playerForm.invalid) {
      this.playerForm.get('nickname')?.markAsDirty();
      return;
    }

    let nickname = this.playerForm.get('nickname')?.value;

    this.playerService.create(nickname).subscribe({
      error: (data) => {
        this.toastrService.error('Nickname error');
      },
      next: (data) => {
        this.toastrService.success(`Connected as ${nickname}`);
      }
    });
  }
}

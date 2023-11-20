import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PlayersService } from 'src/app/services/players.service';
import { AuthPlayerInterface } from 'src/app/interfaces/auth.player.interface';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  playerForm: FormGroup = new FormGroup({
    username: new FormControl(null, [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(30),
      Validators.pattern('^[0-9a-zA-Z_-]+$'),
    ]),
    password: new FormControl(null, [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  constructor(
    private readonly playerService: PlayersService,
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService,
    private readonly router: Router
  ) {}

  onSubmit() {
    if (this.playerForm.invalid) {
      this.playerForm.get('username')?.markAsDirty();
      this.playerForm.get('password')?.markAsDirty();
      return;
    }

    // TODO: adapt login with an interface + rename
    let username = this.playerForm.get('username')?.value;
    let password = this.playerForm.get('password')?.value;

    this.playerService.create(username).subscribe({
      error: (data) => {
        this.toastrService.error('username error');
      },
      next: (data) => {
        const player: AuthPlayerInterface = {
          id: data.id,
          username: data.username,
        };
        this.authService.authenticate(player);
        this.toastrService.success(`Connected as ${username}`);
      },
      complete: () => {
        this.router.navigate(['game-room']);
      },
    });
  }
}

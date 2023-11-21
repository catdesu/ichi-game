import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PlayersService } from 'src/app/services/players.service';
import { RegisterDto } from './dto/register.dto';
import { matchpassword } from './validations/match-password.validators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup = new FormGroup({
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
    confirmPassword: new FormControl(null, [
      Validators.required,
      Validators.minLength(8),
    ]),
  }, { validators: matchpassword });

  constructor(
    private readonly playerService: PlayersService,
    private readonly toastrService: ToastrService,
    private readonly router: Router
  ) {}

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.get('username')?.markAsDirty();
      this.registerForm.get('password')?.markAsDirty();
      this.registerForm.get('confirmPassword')?.markAsDirty();
      return;
    }

    const username = this.registerForm.get('username')?.value;
    const password = this.registerForm.get('password')?.value;
    const registerDto: RegisterDto = { username, password };

    this.playerService.create(registerDto).subscribe({
      error: (data) => {
        this.toastrService.error('Registration failed');
      },
      next: (data) => {
        this.toastrService.success('Registration successful');
      },
      complete: () => {
        this.router.navigate(['auth', 'login']);
      },
    });
  }
}

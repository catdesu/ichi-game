import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { LoginDto } from './dto/login.dto';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup = new FormGroup({
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
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService,
    private readonly router: Router
  ) {}

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.get('username')?.markAsDirty();
      this.loginForm.get('password')?.markAsDirty();
      return;
    }

    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    const loginDto: LoginDto = { username, password };

    this.authService.login(loginDto).subscribe({
      error: (data) => {
        this.toastrService.error('Invalid username or password');
      },
      next: (data) => {
        this.authService.authenticate(data.access_token);
        this.toastrService.success(`Connected as ${username}`);
      },
      complete: () => {
        this.router.navigate(['game-room']);
      },
    });
  }
}

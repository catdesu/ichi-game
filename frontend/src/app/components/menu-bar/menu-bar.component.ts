import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css'],
})
export class MenuBarComponent implements OnInit {
  isAuthenticated: boolean = false;
  username: string = '';

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly router: Router
  ) {
    this.authService.isUserLoggedIn.subscribe((value) => {
      this.isAuthenticated = value;
      if (value)
        this.username = this.jwtService.getJWTData().username;

        console.log(this.username);
    });
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.username = this.jwtService.getJWTData().username;
  }

  logout() {
    this.authService.unauthenticate();
    this.router.navigate(['auth', 'login']);
  }
}

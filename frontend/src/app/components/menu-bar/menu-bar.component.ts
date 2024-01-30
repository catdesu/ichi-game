import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { JwtService } from 'src/app/services/jwt.service';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css'],
})
export class MenuBarComponent implements OnInit {
  isAuthenticated: boolean = false;
  username?: string = '';

  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly router: Router,
    private readonly websocketService: WebsocketService,
  ) {
    this.authService.isUserLoggedIn.subscribe((value: boolean) => {
      this.isAuthenticated = value;
      if (value)
        this.username = this.jwtService.getJWTData()?.username;
    });
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.username = this.jwtService.getJWTData()?.username;
  }

  logout(): void {
    this.authService.unauthenticate();
    this.websocketService.disconnect();
    this.router.navigate(['auth', 'login']);
  }
}

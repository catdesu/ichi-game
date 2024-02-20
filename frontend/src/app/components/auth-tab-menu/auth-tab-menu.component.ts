import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-auth-tab-menu',
  templateUrl: './auth-tab-menu.component.html',
  styleUrls: ['./auth-tab-menu.component.css']
})
export class AuthTabMenuComponent {
  items: MenuItem[] | undefined;

  activeItem: MenuItem | undefined;

  ngOnInit() {
    this.items = [
        { label: 'Login', routerLink: '/auth/login' },
        { label: 'Register', routerLink: '/auth/register' }
    ];

    this.activeItem = this.items[0];
  }
}

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameRoomComponent } from './components/game-room/game-room.component';
import { authGuard } from './guards/auth.guard';
import { AuthTabMenuComponent } from './components/auth-tab-menu/auth-tab-menu.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: 'auth', component: AuthTabMenuComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ],
  },
  { path: 'game-room', canActivate: [authGuard], component: GameRoomComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

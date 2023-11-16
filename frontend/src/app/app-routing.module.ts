import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChooseNicknameComponent } from './components/choose-nickname/choose-nickname.component';
import { GameRoomComponent } from './components/game-room/game-room.component';
import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'nickname' },
  { path: 'nickname', component: ChooseNicknameComponent },
  { path: 'game-room', canActivate: [authGuard], component: GameRoomComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

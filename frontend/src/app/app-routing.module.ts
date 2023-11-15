import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChooseNicknameComponent } from './components/choose-nickname/choose-nickname.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'nickname' },
  { path: 'nickname', component: ChooseNicknameComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

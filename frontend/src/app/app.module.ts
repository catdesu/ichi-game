import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import {ButtonModule} from "primeng/button";
import { CardModule } from "primeng/card";
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { GameRoomComponent } from './components/game-room/game-room.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { MenuBarComponent } from './components/menu-bar/menu-bar.component';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { CardStylePipe } from './pipes/card-style.pipe';
import { PlayerTurnStylePipe } from './pipes/player-turn-style.pipe';

@NgModule({
  declarations: [
    AppComponent,
    GameRoomComponent,
    LoginComponent,
    RegisterComponent,
    MenuBarComponent,
    CardStylePipe,
    PlayerTurnStylePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ToastrModule.forRoot({
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
    }),
    CardModule,
    ButtonModule,
    ReactiveFormsModule,
    InputTextModule,
    BrowserAnimationsModule,
    MenubarModule,
    TableModule
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { Inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = new AuthService();
  const router: Router = new Router();

  if (authService.isauthenticated()) {
    return true;
  } else {
    router.navigate(['nickname']);
    return false;
  }
};

import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {Auth} from "@angular/fire/auth";

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth)
  const router = inject(Router);

  if (auth.currentUser?.email) {
    return true;
  }

  router.navigateByUrl('error');
  return false;
};

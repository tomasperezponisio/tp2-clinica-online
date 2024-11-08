import { CanActivateFn, Router } from '@angular/router';
import { inject } from "@angular/core";
import { LoginService } from "../services/login.service";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";

export const adminGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  return loginService.userData$.pipe(
    map(userData => {
      if (userData?.tipo === 'admin') {
        console.log('User authorized as admin:', userData.nombre);
        return true;
      } else {
        router.navigateByUrl('error');
        return false;
      }
    }),
    catchError(error => {
      router.navigateByUrl('error');
      return of(false);
    })
  );
};

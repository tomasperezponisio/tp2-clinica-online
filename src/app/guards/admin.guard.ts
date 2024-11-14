import { CanActivateFn, Router } from '@angular/router';
import { inject } from "@angular/core";
import { of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import {UsuariosService} from "../services/usuarios.service";

export const adminGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);

  return usuariosService.userData$.pipe(
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

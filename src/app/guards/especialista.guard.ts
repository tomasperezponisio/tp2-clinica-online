import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {UsuariosService} from "../services/usuarios.service";
import {catchError, map} from "rxjs/operators";
import {of} from "rxjs";

export const especialistaGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);

  return usuariosService.userData$.pipe(
    map(userData => {
      if (userData?.tipo === 'especialista') {
        console.log('usuario autorizado especialista:', userData.nombre);
        return true;
      } else {
        console.log('No es especialista:', userData.nombre);
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

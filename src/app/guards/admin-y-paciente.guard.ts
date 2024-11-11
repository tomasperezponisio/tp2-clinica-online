import {CanActivateFn, Router} from '@angular/router';
import {inject} from "@angular/core";
import {UsuariosService} from "../services/usuarios.service";
import {catchError, map} from "rxjs/operators";
import {of} from "rxjs";

export const adminYPacienteGuard: CanActivateFn = (route, state) => {
  const usuariosService = inject(UsuariosService);
  const router = inject(Router);

  return usuariosService.userData$.pipe(
    map(userData => {
      if (userData?.tipo === 'admin' || userData?.tipo === 'paciente') {
        console.log('usuario autorizado admin o paciente:', userData.nombre);
        return true;
      } else {
        console.log('No es admin o paciente:', userData.nombre);
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

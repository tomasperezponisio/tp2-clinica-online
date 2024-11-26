import { Injectable } from '@angular/core';
import { Auth, authState, User } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { UsuariosService } from './usuarios.service';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth, private usuariosService: UsuariosService) { }

  /**
   * Método que obtiene el usuario actualmente autenticado.
   *
   * @return {Observable<any>} Un observable que emite la información del usuario autenticado,
   *                            o null si no hay un usuario autenticado.
   */
  traerUsuarioActual(): Observable<any> {
    return authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (user) {
          return this.usuariosService.traerDataDeUsuario(user.uid);
        } else {
          return of(null);
        }
      })
    );
  }
}

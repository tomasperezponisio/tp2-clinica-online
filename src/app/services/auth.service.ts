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

  traerUsuarioActual(): Observable<any> {
    return authState(this.auth).pipe(
      switchMap((user: User | null) => {
        if (user) {
          return this.usuariosService.getUserData(user.uid);
        } else {
          return of(null);
        }
      })
    );
  }
}

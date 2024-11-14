import {Component, OnInit} from '@angular/core';
import {Observable} from "rxjs";
import {UsuariosService} from "../../services/usuarios.service";
import {AsyncPipe, NgIf} from "@angular/common";
import {MisHorariosComponent} from "./componentes/mis-horarios/mis-horarios.component";

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    MisHorariosComponent
  ],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent implements OnInit {
  userData$!: Observable<any>;
  userType: string = '';

  constructor(
    private usuariosService: UsuariosService
  ) {
  }

  ngOnInit(): void {
    this.userData$ = this.usuariosService.userData$;

    this.userData$.subscribe((data) => {
      if (data && data.isLoggedIn) {
        this.userType = data.tipo;
      } else {
        console.log('No user data available.');
      }
    });
  }
}

import {Component, OnInit} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {Observable} from "rxjs";
import {UsuariosService} from "../../../../services/usuarios.service";

@Component({
  selector: 'app-tabla-usuarios',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    AsyncPipe
  ],
  templateUrl: './tabla-usuarios.component.html',
  styleUrl: './tabla-usuarios.component.css'
})
export class TablaUsuariosComponent implements OnInit {
  usuarios$!: Observable<any[]>

  constructor(
    private usuariosService: UsuariosService
  ) {
  }

  ngOnInit(): void {
    this.usuarios$ = this.usuariosService.getUsuarios();
  }

  toggleVerificado(user: any) {
    user.verificado = !user.verificado;
    this.usuariosService.updateVerificado(user.uid, user.verificado);
  }
}

import { Component } from '@angular/core';
import {TablaUsuariosComponent} from "./componentes/tabla-usuarios/tabla-usuarios.component";

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    TablaUsuariosComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent {

}

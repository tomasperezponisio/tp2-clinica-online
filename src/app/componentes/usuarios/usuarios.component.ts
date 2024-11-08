import { Component } from '@angular/core';
import {TablaUsuariosComponent} from "./componentes/tabla-usuarios/tabla-usuarios.component";
import {RegisterComponent} from "../register/register.component";

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    TablaUsuariosComponent,
    RegisterComponent
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent {

}

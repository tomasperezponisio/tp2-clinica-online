import { Routes } from '@angular/router';
import {adminGuard} from "./guards/admin.guard";
import {UsuariosComponent} from "./componentes/usuarios/usuarios.component";
import {MiPerfilComponent} from "./componentes/mi-perfil/mi-perfil.component";
import {authGuard} from "./guards/auth.guard";
import {MisTurnosComponent} from "./componentes/mis-turnos/mis-turnos.component";
import {TurnosComponent} from "./componentes/turnos/turnos.component";
import {SolicitarTurnosComponent} from "./componentes/solicitar-turnos/solicitar-turnos.component";
import {adminYPacienteGuard} from "./guards/admin-y-paciente.guard";
import {especialistaYPacienteGuard} from "./guards/especialista-y-paciente.guard";

export const routes: Routes = [
  {
    path: '', loadComponent: () => import('./componentes/home/home.component')
      .then(c => c.HomeComponent), pathMatch: "full"
  },
  {
    path: 'home', loadComponent: () => import('./componentes/home/home.component')
      .then(c => c.HomeComponent), pathMatch: "full"
  },
  {
    path: 'login', loadComponent: () => import('./componentes/login/login.component')
      .then(c => c.LoginComponent)
  },
  {
    path: 'register', loadComponent: () => import('./componentes/register/register.component')
      .then(c => c.RegisterComponent)
  },
  {
    path: 'error', loadComponent: () => import('./componentes/error-page/error-page.component')
      .then(c => c.ErrorPageComponent)
  },
  {
    path: "usuarios",
    data: {midata: "datos de ruta"},
    component: UsuariosComponent,
    canActivate: [adminGuard],
  },
  {
    path: "turnos",
    data: {midata: "datos de ruta"},
    component: MisTurnosComponent,
    canActivate: [adminGuard],
  },
  {
    path: "mi-perfil",
    data: {midata: "datos de ruta"},
    component: MiPerfilComponent,
    canActivate: [authGuard],
  },
  {
    path: "mis-turnos",
    data: {midata: "datos de ruta"},
    component: MisTurnosComponent,
    canActivate: [especialistaYPacienteGuard],
  },
  {
    path: "solicitar-turno",
    data: {midata: "datos de ruta"},
    component: SolicitarTurnosComponent,
    canActivate: [adminYPacienteGuard],
  },
  {
    path: '**', loadComponent: () => import('./componentes/error-page/error-page.component')
      .then(c => c.ErrorPageComponent)
  },
];

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
import {PacientesComponent} from "./componentes/pacientes/pacientes.component";
import {especialistaGuard} from "./guards/especialista.guard";

export const routes: Routes = [
  {
    path: '', loadComponent: () => import('./componentes/home/home.component')
      .then(c => c.HomeComponent), pathMatch: "full", data: { animation: 'home' }
  },
  {
    path: 'home', loadComponent: () => import('./componentes/home/home.component')
      .then(c => c.HomeComponent), pathMatch: "full", data: { animation: 'home' }
  },
  {
    path: 'login', loadComponent: () => import('./componentes/login/login.component')
      .then(c => c.LoginComponent), data: { animation: 'login' }
  },
  {
    path: 'register', loadComponent: () => import('./componentes/register/register.component')
      .then(c => c.RegisterComponent), data: { animation: 'register' }
  },
  {
    path: 'error', loadComponent: () => import('./componentes/error-page/error-page.component')
      .then(c => c.ErrorPageComponent), data: { animation: 'error' }
  },
  {
    path: "usuarios",
    data: { animation: 'usuarios' },
    component: UsuariosComponent,
    canActivate: [adminGuard],
  },
  {
    path: "turnos",
    data: { animation: 'turnos' },
    component: MisTurnosComponent,
    canActivate: [adminGuard],
  },
  {
    path: "mi-perfil",
    data: { animation: 'mi-perfil' },
    component: MiPerfilComponent,
    canActivate: [authGuard],
  },
  {
    path: "mis-turnos",
    data: { animation: 'mis-turnos' },
    component: MisTurnosComponent,
    canActivate: [especialistaYPacienteGuard],
  },
  {
    path: "solicitar-turno",
    data: { animation: 'solicitar-turnos' },
    component: SolicitarTurnosComponent,
    canActivate: [adminYPacienteGuard],
  },
  {
    path: "pacientes",
    data: { animation: 'pacientes' },
    component: PacientesComponent,
    canActivate: [especialistaGuard],
  },
  {
    path: '**', loadComponent: () => import('./componentes/error-page/error-page.component')
      .then(c => c.ErrorPageComponent)
  },
];

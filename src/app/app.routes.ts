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
import {InformesComponent} from "./componentes/informes/informes.component";

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
    loadComponent: () => import('./componentes/usuarios/usuarios.component').then(c => c.UsuariosComponent),
    data: { animation: 'usuarios' },
    canActivate: [adminGuard],
  },
  {
    path: "turnos",
    loadComponent: () => import('./componentes/mis-turnos/mis-turnos.component').then(c => c.MisTurnosComponent),
    data: { animation: 'turnos' },
    canActivate: [adminGuard],
  },
  {
    path: "informes",
    loadComponent: () => import('./componentes/informes/informes.component').then(c => c.InformesComponent),
    data: { animation: 'informes' },
    canActivate: [adminGuard],
  },
  {
    path: "mi-perfil",
    loadComponent: () => import('./componentes/mi-perfil/mi-perfil.component').then(c => c.MiPerfilComponent),
    data: { animation: 'mi-perfil' },
    canActivate: [authGuard],
  },
  {
    path: "mis-turnos",
    loadComponent: () => import('./componentes/mis-turnos/mis-turnos.component').then(c => c.MisTurnosComponent),
    data: { animation: 'mis-turnos' },
    canActivate: [especialistaYPacienteGuard],
  },
  {
    path: "solicitar-turno",
    loadComponent: () => import('./componentes/solicitar-turnos/solicitar-turnos.component').then(c => c.SolicitarTurnosComponent),
    data: { animation: 'solicitar-turnos' },
    canActivate: [adminYPacienteGuard],
  },
  {
    path: "pacientes",
    loadComponent: () => import('./componentes/pacientes/pacientes.component').then(c => c.PacientesComponent),
    data: { animation: 'pacientes' },
    canActivate: [especialistaGuard],
  },
  {
    path: '**', loadComponent: () => import('./componentes/error-page/error-page.component')
      .then(c => c.ErrorPageComponent)
  },
];

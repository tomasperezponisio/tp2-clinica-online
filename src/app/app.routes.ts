import { Routes } from '@angular/router';
import {adminGuard} from "./guards/admin.guard";
import {UsuariosComponent} from "./componentes/usuarios/usuarios.component";

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
    path: '**', loadComponent: () => import('./componentes/error-page/error-page.component')
      .then(c => c.ErrorPageComponent)
  },
];

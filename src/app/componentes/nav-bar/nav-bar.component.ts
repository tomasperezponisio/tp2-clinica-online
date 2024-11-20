import {Component, OnInit} from '@angular/core';
import {Router, RouterLink, RouterLinkActive, RouterOutlet, ChildrenOutletContexts} from "@angular/router";
import {AsyncPipe, NgIf} from "@angular/common";
import {LoginService} from "../../services/login.service";
import {UsuariosService} from "../../services/usuarios.service";
import {AlertService} from "../../services/alert.service";
import { slideInAnimation } from '../../animations/animations';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    RouterLink,
    RouterLinkActive,
    AsyncPipe
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css',
  animations: [
    slideInAnimation
  ]
})
export class NavBarComponent implements OnInit {
  userData: { isLoggedIn: boolean; tipo?: string; nombre?: string } | null = null;

  constructor(
    private router: Router,
    protected loginService: LoginService,
    protected usuariosService: UsuariosService,
    private alertService: AlertService,
    private contexts: ChildrenOutletContexts,
  ) {
  }

  ngOnInit(): void {
    this.usuariosService.userData$.subscribe((data) => {
      this.userData = data;
    });
  }

  closeSession() {
    this.loginService.auth.signOut().then(() => {
      this.alertService.customAlert('Cerraste sesión!', "Logueate para acceder.", 'error').then(() => {
        this.router.navigate(['home']);
      });
    });
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }

}
